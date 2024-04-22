import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const Video = (props) => {
  const {
    url,
    description = 'A video that explains the task.',
    ...rest
  } = props;
  const [loading, setLoading] = useState(true);

  const video = useRef();

  const handleClick = () => {
    if (!video.current) {
      return;
    }

    if (video.current.paused) {
      video.current.play();
    } else {
      video.current.pause();
    }
  };

  const handleVideoLoaded = () => {
    setLoading(false);
  };

  useEffect(() => {
    if (!video.current) {
      return;
    }

    if (video.current.readyState >= 2) {
      setLoading(false);
      void video.current.play();
    }
  }, [video]);

  return (
    <>
      {loading && (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="mr-4 animate-spin" />
          <span>Loading video...</span>
        </div>
      )}
      <video
        {...rest}
        ref={video}
        src={url}
        playsInline
        onClick={handleClick}
        onCanPlay={handleVideoLoaded}

      >
        {description}
      </video>
    </>
  );
};

Video.propTypes = {
  description: PropTypes.string,
  url: PropTypes.string.isRequired,
};

export default Video;
