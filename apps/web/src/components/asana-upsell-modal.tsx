"use client";

type AsanaUpsellModalProps = {
  title: string;
  description: string;
  learnMoreUrl?: string;
  backgroundImage?: string;
};

export function AsanaUpsellModal({
  title,
  description,
  learnMoreUrl,
  backgroundImage,
}: AsanaUpsellModalProps) {
  return (
    <div className="relative h-full min-h-screen bg-[#F6F7F8]">
      {/* Blurred Background */}
      {backgroundImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={backgroundImage}
            className="h-full w-full object-cover blur-sm opacity-50"
            alt="Preview"
          />
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
          <h4 className="mb-4 text-xl font-semibold text-gray-900">
            {title}
          </h4>
          <p className="mb-6 text-gray-600">
            {description}
            {learnMoreUrl && (
              <>
                {" "}
                <a href={learnMoreUrl} className="text-blue-600 hover:underline">
                  Learn more
                </a>
              </>
            )}
          </p>
          <button className="inline-flex items-center gap-2 rounded bg-[#F0A344] px-4 py-2 text-sm font-medium text-white hover:bg-[#E09334]">
            <span>🔓</span>
            Try for free
          </button>
        </div>
      </div>
    </div>
  );
}
