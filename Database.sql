-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Users (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  player_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  username text UNIQUE CHECK (length(username) <= 70),
  user_id uuid DEFAULT gen_random_uuid() UNIQUE,
  CONSTRAINT Users_pkey PRIMARY KEY (player_id),
  CONSTRAINT fk_users_auth_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campaign_timers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  campaign_name text DEFAULT 'Hauptkampagne'::text,
  game_time timestamp with time zone NOT NULL DEFAULT '1337-05-23 08:00:00+00'::timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT campaign_timers_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_timers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.character_attributes (
  id integer NOT NULL DEFAULT nextval('character_attributes_id_seq'::regclass),
  character_id uuid,
  str integer,
  dex integer,
  body integer,
  spd integer,
  emp integer,
  cra integer,
  will integer,
  luck integer,
  CONSTRAINT character_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT character_attributes_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.character_derived (
  id integer NOT NULL DEFAULT nextval('character_derived_id_seq'::regclass),
  character_id uuid,
  sta integer,
  shp integer,
  stun integer,
  run integer,
  leap integer,
  rec integer,
  enc integer,
  vigor integer,
  CONSTRAINT character_derived_pkey PRIMARY KEY (id),
  CONSTRAINT character_derived_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.character_gear (
  id integer NOT NULL DEFAULT nextval('character_gear_id_seq'::regclass),
  character_id uuid,
  name text,
  type text,
  damage text,
  properties jsonb,
  equipped boolean DEFAULT false,
  CONSTRAINT character_gear_pkey PRIMARY KEY (id),
  CONSTRAINT character_gear_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.character_items (
  id integer NOT NULL DEFAULT nextval('character_items_id_seq'::regclass),
  character_id uuid,
  item_id integer,
  equipped boolean DEFAULT false,
  quantity integer DEFAULT 1,
  custom_name text,
  modifications jsonb,
  CONSTRAINT character_items_pkey PRIMARY KEY (id),
  CONSTRAINT character_items_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id),
  CONSTRAINT character_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.character_skills (
  id integer NOT NULL DEFAULT nextval('character_skills_id_seq'::regclass),
  character_id uuid,
  skill_name text,
  skill_type text,
  value integer,
  CONSTRAINT character_skills_pkey PRIMARY KEY (id),
  CONSTRAINT character_skills_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);
CREATE TABLE public.characters (
  game_id bigint,
  player_id bigint,
  name text NOT NULL,
  race text,
  profession text,
  background text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  alive boolean DEFAULT true,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  stats jsonb,
  level smallint,
  CONSTRAINT characters_pkey PRIMARY KEY (id),
  CONSTRAINT characters_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT characters_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.Users(player_id),
  CONSTRAINT fk_characters_users FOREIGN KEY (player_id) REFERENCES public.Users(id)
);
CREATE TABLE public.entity_links (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  source_entity_type text NOT NULL,
  source_entity_id uuid NOT NULL,
  target_entity_name text NOT NULL,
  target_entity_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  game_id bigint NOT NULL,
  CONSTRAINT entity_links_pkey PRIMARY KEY (id),
  CONSTRAINT entity_links_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.folders (
  id bigint NOT NULL DEFAULT nextval('folders_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  parent_id bigint,
  game_id bigint,
  creator_uuid uuid,
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id),
  CONSTRAINT folders_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT folders_creator_uuid_fkey FOREIGN KEY (creator_uuid) REFERENCES public.Users(user_id)
);
CREATE TABLE public.game_players (
  id bigint NOT NULL,
  game_id bigint NOT NULL,
  player_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  player_uid uuid,
  CONSTRAINT game_players_pkey PRIMARY KEY (id),
  CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT fk_player FOREIGN KEY (player_id) REFERENCES public.Users(id),
  CONSTRAINT game_players_player_uid_fkey FOREIGN KEY (player_uid) REFERENCES public.Users(user_id)
);
CREATE TABLE public.games (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  name text CHECK (length(name) <= 70),
  password text NOT NULL,
  gamemaster_uuid uuid,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_gamemaster_uuid_fkey FOREIGN KEY (gamemaster_uuid) REFERENCES public.Users(user_id)
);
CREATE TABLE public.ingame_clock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id bigint NOT NULL UNIQUE,
  ingame_timestamp timestamp with time zone NOT NULL DEFAULT '1337-05-23 08:00:00+00'::timestamp with time zone,
  ingame_weekday smallint NOT NULL,
  ingame_date date NOT NULL,
  ingame_time time without time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ingame_clock_pkey PRIMARY KEY (id),
  CONSTRAINT ingame_clock_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.items (
  id integer NOT NULL DEFAULT nextval('items_id_seq'::regclass),
  name text NOT NULL,
  type text,
  rarity text,
  description text,
  damage text,
  armor_sp integer,
  durability integer,
  weight double precision,
  effects jsonb,
  price integer,
  usable_by text,
  requires_vigor integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.locations (
  id integer NOT NULL DEFAULT nextval('locations_id_seq'::regclass),
  name text NOT NULL,
  description text,
  parent_region text,
  game_id integer,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  content text,
  game_id bigint NOT NULL,
  creator_id uuid,
  ingame_time timestamp with time zone,
  CONSTRAINT logs_pkey PRIMARY KEY (id),
  CONSTRAINT logs_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES public.Users(user_id)
);
CREATE TABLE public.npc_location_links (
  id integer NOT NULL DEFAULT nextval('npc_location_links_id_seq'::regclass),
  npc_id integer NOT NULL,
  location_id integer NOT NULL,
  relation_type text,
  start_year integer,
  end_year integer,
  CONSTRAINT npc_location_links_pkey PRIMARY KEY (id),
  CONSTRAINT npc_location_links_npc_id_fkey FOREIGN KEY (npc_id) REFERENCES public.npcs(id),
  CONSTRAINT npc_location_links_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.npcs (
  id integer NOT NULL DEFAULT nextval('npcs_id_seq'::regclass),
  game_id integer NOT NULL,
  name text NOT NULL,
  location_id integer,
  race text,
  age integer,
  story text,
  profession text,
  article_id integer,
  usecase text,
  goal text,
  CONSTRAINT npcs_pkey PRIMARY KEY (id),
  CONSTRAINT npcs_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT npcs_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  content text,
  kategorie text,
  folder_id bigint,
  game_id integer NOT NULL,
  creator uuid,
  location_id integer,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT posts_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT posts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.story (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id bigint NOT NULL,
  log_id bigint,
  label text NOT NULL,
  description text,
  type text NOT NULL CHECK (type = ANY (ARRAY['start'::text, 'story'::text, 'gateway'::text, 'event'::text, 'end'::text, 'questGroup'::text, 'note'::text, 'npc'::text, 'location'::text, 'combat'::text, 'reward'::text])),
  done boolean DEFAULT false,
  color text DEFAULT '#3b82f6'::text,
  position jsonb,
  predecessors jsonb DEFAULT '[]'::jsonb,
  inserted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parent_node_id uuid,
  image_url text,
  tags ARRAY DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  linked_article_id bigint,
  linked_npc_id integer,
  linked_item_id integer,
  linked_location_id integer,
  CONSTRAINT story_pkey PRIMARY KEY (id),
  CONSTRAINT story_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id),
  CONSTRAINT story_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.logs(id),
  CONSTRAINT story_parent_node_id_fkey FOREIGN KEY (parent_node_id) REFERENCES public.story(id),
  CONSTRAINT story_linked_location_id_fkey FOREIGN KEY (linked_location_id) REFERENCES public.locations(id),
  CONSTRAINT story_linked_article_id_fkey FOREIGN KEY (linked_article_id) REFERENCES public.posts(id),
  CONSTRAINT story_linked_npc_id_fkey FOREIGN KEY (linked_npc_id) REFERENCES public.npcs(id),
  CONSTRAINT story_linked_item_id_fkey FOREIGN KEY (linked_item_id) REFERENCES public.items(id)
);
CREATE TABLE public.timeline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL DEFAULT 'period_placeholder'::text,
  starting_date date DEFAULT '1010-01-01'::date,
  end_date date DEFAULT '1111-01-01'::date,
  is_period boolean NOT NULL DEFAULT false,
  is_event boolean NOT NULL DEFAULT true,
  event_date date,
  description text DEFAULT 'description text'::text,
  game_id bigint NOT NULL DEFAULT '0'::bigint,
  is_era boolean NOT NULL DEFAULT false,
  CONSTRAINT timeline_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id)
);
CREATE TABLE public.witcher_signs (
  id integer NOT NULL DEFAULT nextval('witcher_signs_id_seq'::regclass),
  character_id uuid,
  sign_name text,
  description text,
  learned boolean DEFAULT false,
  vigor_cost integer,
  CONSTRAINT witcher_signs_pkey PRIMARY KEY (id),
  CONSTRAINT witcher_signs_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id)
);