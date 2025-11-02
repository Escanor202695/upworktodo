import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/tasks/[id]/toggle - Toggle task done status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

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
