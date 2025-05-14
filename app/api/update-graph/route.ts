// app/api/update-graph/route.ts
import { NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST() {
  return new Promise<NextResponse>((resolve) => {
    // Starte npm run update-graph (siehe package.json)
    const child = spawn('npm', ['run', 'update-graph'], {
      cwd: process.cwd(),
      shell: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ update-graph succeeded:', stdout)
        resolve(
          NextResponse.json(
            { success: true, stdout },
            { status: 200 }
          )
        )
      } else {
        console.error('❌ update-graph failed (code ' + code + '):', stderr)
        resolve(
          NextResponse.json(
            { success: false, error: stderr || `Exit code ${code}` },
            { status: 500 }
          )
        )
      }
    })
  })
}
