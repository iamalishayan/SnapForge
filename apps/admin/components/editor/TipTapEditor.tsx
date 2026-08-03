"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useCallback, useEffect } from 'react'
interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-border/30 bg-[#0A0A0A] rounded-t-xl sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold italic transition-colors ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
      >
        Italic
      </button>
      <div className="w-px h-6 bg-border/50 mx-1 self-center"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
      >
        H2
      </button>
      <div className="w-px h-6 bg-border/50 mx-1 self-center"></div>
      <button
        type="button"
        onClick={setLink}
        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${editor.isActive('link') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
      >
        Link
      </button>
    </div>
  )
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80 transition-colors',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base focus:outline-none min-h-[300px] p-6 max-w-none'
      }
    }
  })

  // To update content if it changes externally (e.g. via HTML Import)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden bg-[#050505] shadow-inner focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
      <MenuBar editor={editor} />
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
