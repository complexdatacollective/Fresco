/**
 * Renders a connector between partners.
 */

export default function PartnerConnector(props: {
  xStartPos: number;
  xEndPos: number;
  yPos: number;
}) {
  const { xStartPos, xEndPos, yPos } = props;

  return (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
      <line
        x1={xStartPos}
        y1={yPos - 5}
        x2={xEndPos}
        y2={yPos - 5}
        stroke="#807ea1"
      />
      <line
        x1={xStartPos}
        y1={yPos + 5}
        x2={xEndPos}
        y2={yPos + 5}
        stroke="#807ea1"
      />
    </svg>
  );
}
