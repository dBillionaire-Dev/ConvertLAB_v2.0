const MESSAGE = "App currently under maintenance & upgrade by Nezer Ekunke. You may notice some changes, please confirm values manually before proceeding."

export function MaintenanceBanner() {
  return (
    <div className="bg-blue-600 text-white py-1.5 text-sm">
      <span className="sr-only" role="status">
        {MESSAGE}
      </span>
      <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
        <div className="inline-flex animate-marquee">
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
        </div>
        <div className="inline-flex animate-marquee">
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
          <span className="mx-6">{MESSAGE}</span>
        </div>
      </div>
    </div>
  )
}
