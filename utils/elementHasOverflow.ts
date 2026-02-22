const elementHasOverflow = ({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
}: {
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}) => scrollHeight > clientHeight || scrollWidth > clientWidth;

export default elementHasOverflow;
