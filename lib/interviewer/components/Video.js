import { useRef, useState } from 'react';
import PropTypes from 'prop-types';

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
      {loading && <div>Loading video...</div>}
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
