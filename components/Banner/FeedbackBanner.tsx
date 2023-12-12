import FeedbackButton from './FeedbackButton';

const FeedbackBanner = () => {
  return (
    <div className="mx-auto flex items-center gap-x-3">
      <p className="text-sm leading-6 text-gray-900">
        <strong className="font-semibold">🤖 Fresco is Alpha software</strong>
        <svg
          viewBox="0 0 2 2"
          className="mx-2 inline h-0.5 w-0.5 fill-current"
          aria-hidden="true"
        >
          <circle cx={1} cy={1} r={1} />
        </svg>
        We would appreciate input about how we can improve it, and reports or
        any issues you find.
      </p>
      <FeedbackButton />
    </div>
  );
};

export default FeedbackBanner;
