import { env } from '~/env';

export default function NetlifyBadge() {
  if (!env.SANDBOX_MODE) {
    return null;
  }

  return (
    <footer className="flex justify-center py-4">
      <a href="https://www.netlify.com">
        <img
          src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg"
          alt="Deploys by Netlify"
        />
      </a>
    </footer>
  );
}
