type ActionPanelButtonProps = {
  title: string;
  description: string;
  color: string;
  btnText: string;
};

export default function ActionPanelButton({
  title,
  description,
  color,
  btnText,
}: ActionPanelButtonProps) {
  return (
    <div className="my-6 bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          {title}
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{description}</p>
        </div>
        <div className="mt-5">
          <button
            type="button"
            className={`inline-flex items-center rounded-md bg-${color}-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-${color}-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-${color}-500`}
          >
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
