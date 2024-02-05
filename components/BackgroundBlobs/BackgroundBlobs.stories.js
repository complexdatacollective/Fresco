import BackgroundBlobs from '../src/components/art/BackgroundBlobs';
import '../src/styles/_all.scss';

export default { title: 'Art/Background Blobs' };

export const normal = () => (
  <div
    style={{
      width: '800px',
      height: '600px',
      border: '1px solid white',
      borderRadius: 'var(--nc-border-radius)',
      overflow: 'hidden',
      background: 'white',
    }}
  >
    <BackgroundBlobs />
  </div>
);

export const fullScreen = () => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'white',
    }}
  >
    <BackgroundBlobs />
  </div>
);

export const small = () => (
  <div
    style={{
      width: '300px',
      height: '300px',
      border: '1px solid white',
      borderRadius: 'var(--nc-border-radius)',
      overflow: 'hidden',
      background: 'white',
    }}
  >
    <BackgroundBlobs />
  </div>
);

export const customNumbers = () => (
  <div style={{ display: 'flex' }}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        alignItems: 'center',
      }}
    >
      <h4>Loadsa large</h4>
      <div
        style={{
          width: '300px',
          height: '300px',
          border: '1px solid white',
          borderRadius: 'var(--nc-border-radius)',
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <BackgroundBlobs large={7} medium={0} small={0} />
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        alignItems: 'center',
      }}
    >
      <h4>Twenty Small</h4>
      <div
        style={{
          width: '300px',
          height: '300px',
          border: '1px solid white',
          borderRadius: 'var(--nc-border-radius)',
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <BackgroundBlobs large={0} medium={0} small={20} />
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '1rem',
        alignItems: 'center',
      }}
    >
      <h4>Medium and Small</h4>
      <div
        style={{
          width: '300px',
          height: '300px',
          border: '1px solid white',
          borderRadius: 'var(--nc-border-radius)',
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <BackgroundBlobs large={0} medium={5} small={5} />
      </div>
    </div>
  </div>
);
