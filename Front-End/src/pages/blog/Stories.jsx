export default function Stories() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Stories</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Read Stories</h2>
          <p className="text-muted mb-4">
            Public page for reading stories. Placeholder content.
          </p>
          <ul className="space-y-2">
            <li className="p-4 bg-input dark:bg-dark-input rounded-lg">
              Sample story 1
            </li>
            <li className="p-4 bg-input dark:bg-dark-input rounded-lg">
              Sample story 2
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Write Story</h2>
          <p className="text-muted mb-4">
            Public page for writing/submitting stories. Placeholder form.
          </p>
          <form className="space-y-4">
            <textarea
              placeholder="Write your story..."
              className="w-full p-3 border border-default dark:border-dark-default rounded-lg bg-input dark:bg-dark-input"
              rows="6"
            />
            <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
              Submit Story
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
