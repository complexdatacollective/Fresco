/* eslint-disable @typescript-eslint/only-throw-error */
import { objectHash } from 'ohash';
import { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeColor } from '~/lib/interviewer/selectors/session';
import { entityAttributesProperty, type NcNode } from '~/lib/shared-consts';
import UINode from '~/lib/ui/components/Node';
import { useNodeLabel } from '../containers/Interfaces/Anonymisation/useNodeLabel';

const Node = memo(
  forwardRef<React.ElementRef<typeof UINode>, NcNode>((props: NcNode, ref) => {
    // const [label, setLabel] = useState<string | undefined>(undefined);
    // const [loading, setLoading] = useState(true);
    const { type } = props;
    const color = useSelector(getNodeColor(type));
    const label = useNodeLabel(props);

    // useEffect(() => {
    //   async function getLabel() {
    //     setLoading(true);
    //     try {
    //       const result = await decryptData(
    //         {
    //           secureAttributes: {
    //             iv: props[entitySecureAttributesMeta][
    //               '28c8ae72-2b6a-438f-ab09-35169aaffdeb'
    //             ].iv,
    //             salt: props[entitySecureAttributesMeta][
    //               '28c8ae72-2b6a-438f-ab09-35169aaffdeb'
    //             ].salt,
    //           },
    //           data: props[entityAttributesProperty][
    //             '28c8ae72-2b6a-438f-ab09-35169aaffdeb'
    //           ],
    //         },
    //         'test',
    //       );

    //       console.log('result', result);

    //       setLabel(result);
    //       setLoading(false);
    //     } catch (e) {
    //       console.error(e);
    //     }
    //   }

    //   void getLabel();
    // }, [props]);

    return (
      <UINode
        color={color}
        {...props}
        label={label}
        ref={ref}
        loading={!label}
      />
    );
  }),
  (prevProps, nextProps) => {
    return (
      objectHash(prevProps[entityAttributesProperty]) ===
      objectHash(nextProps[entityAttributesProperty])
    );
  },
);

Node.displayName = 'Node';

export default Node;
