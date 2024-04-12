import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

const Video = (props) => {
  const { url, description = 'A video that explains the task.', ...rest } = props;
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
  }

  return (
    <>
      {loading && <div className='h-full w-full flex items-center justify-center'><Loader2 className='animate-spin mr-4' /><span>Loading video...</span></div>}
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
}

Video.propTypes = {
  description: PropTypes.string,
  url: PropTypes.string.isRequired,
};

export default Video;
