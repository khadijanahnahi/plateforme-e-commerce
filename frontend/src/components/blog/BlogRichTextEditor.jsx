import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

function ToolbarButton({ active, children, disabled, onClick, title }) {
  return <button className={active ? "is-active" : ""} disabled={disabled} type="button" title={title} onClick={onClick}>{children}</button>;
}

export default function BlogRichTextEditor({ initialJson, onChange, onUploadImage, uploading }) {
  const fileRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: false, inline: false }),
      Placeholder.configure({ placeholder: "Rédigez votre article ShopSphere..." }),
    ],
    content: initialJson ? JSON.parse(initialJson) : "",
    editorProps: { attributes: { class: "blog-editor-content", spellcheck: "true" } },
    onUpdate({ editor: current }) {
      const text = current.getText().trim();
      onChange?.({ json: JSON.stringify(current.getJSON()), html: current.getHTML(), words: text ? text.split(/\s+/).length : 0 });
    },
  });

  useEffect(() => {
    if (!editor || !initialJson) return;
    const next = JSON.stringify(JSON.parse(initialJson));
    if (JSON.stringify(editor.getJSON()) !== next) editor.commands.setContent(JSON.parse(initialJson), false);
  }, [editor, initialJson]);

  if (!editor) return null;

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const media = await onUploadImage(file);
    if (media?.url) editor.chain().focus().setImage({ src: media.url, alt: file.name }).run();
  }

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const href = window.prompt("Adresse du lien (https://...)", previous || "https://");
    if (href === null) return;
    if (!href) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return (
    <div className="blog-rich-editor">
      <div className="blog-editor-toolbar" role="toolbar" aria-label="Mise en forme de l’article">
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>G</strong></ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>Liste</ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Liste</ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Citation</ToolbarButton>
        <ToolbarButton active={editor.isActive("link")} onClick={setLink}>Lien</ToolbarButton>
        <ToolbarButton disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? "Envoi..." : "Image"}</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>Séparateur</ToolbarButton>
        <ToolbarButton disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>Annuler</ToolbarButton>
        <ToolbarButton disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>Rétablir</ToolbarButton>
        <input ref={fileRef} hidden accept="image/jpeg,image/png,image/webp" type="file" onChange={upload} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
