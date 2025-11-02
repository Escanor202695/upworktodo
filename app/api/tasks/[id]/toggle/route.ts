import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/tasks/[id]/toggle - Toggle task done status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // First, check if the task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify your own tasks' },
        { status: 403 }
      )
    }

    // Toggle the done status
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { done: !task.done },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error toggling task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
