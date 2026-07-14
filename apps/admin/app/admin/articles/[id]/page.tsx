// Article editor — same as new article but pre-filled with existing article data for editing
export default function EditArticlePage({ params }: { params: { id: string } }) {
  return <div>Edit article {params.id} — pre-filled TipTap editor goes here</div>
}
