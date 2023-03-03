import { useIsFetching } from '@tanstack/react-query'
import { Spinner } from "@codaco/ui";

function FetchingIndicator() {
  const isFetching = useIsFetching()
  
  return isFetching ? (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <Spinner />
    </div>
  ) : null
}

 export default FetchingIndicator;