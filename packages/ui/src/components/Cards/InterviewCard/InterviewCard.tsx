import type { MouseEvent, KeyboardEvent } from "react";
import cx from "classnames";
import ProgressBar from "../ProgressBar";
import HoverMarquee from "../HoverMarquee";
import StartedIcon from "@/images/StartedIcon.svg";
import ModifiedIcon from "@/images/ModifiedIcon.svg";
import FinishedIcon from "@/images/FinishedIcon.svg";
import ExportedIcon from "@/images/ExportedIcon.svg";
import "./InterviewCard.scss";

// const HoverMarquee = ({ children }: { children: React.ReactNode }) => (
//   <div className="hover-marquee">
//     {children}
//   </div>
// );

const formatDate = (dateString: Date) =>
  dateString && new Date(dateString).toLocaleString(undefined);

type InterviewCardProps = {
  id: string;
  caseId?: string;
  startedAt: Date;
  updatedAt: Date;
  finishedAt?: Date | null;
  exportedAt?: Date | null;
  protocolName: string;
  progress: number;
  selected?: boolean;
  onClickHandler?: (() => void) | undefined;
};

function InterviewCard({
  id,
  caseId = "",
  startedAt,
  updatedAt,
  finishedAt = null,
  exportedAt = null,
  protocolName,
  progress,
  selected = false,
  onClickHandler = undefined,
}: InterviewCardProps) {
  const modifierClasses = cx(
    "interview-card",
    { "interview-card--clickable": !!onClickHandler },
    { "interview-card--selected": selected }
  );

  const handleClick = (
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    if (onClickHandler) {
      onClickHandler();
    }
  };

  return (
    <div
      className={modifierClasses}
      onClick={handleClick}
      onKeyDown={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="main-wrapper">
        <h2 className="card__label">
          <HoverMarquee>{caseId || id}</HoverMarquee>
        </h2>
        <h5 className="card__protocol">
          <HoverMarquee>
            {protocolName || (
              <span className="highlight">Unavailable protocol!</span>
            )}
          </HoverMarquee>
        </h5>
      </div>
      <div className="meta-wrapper">
        <div className="meta">
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={StartedIcon} alt="Interview started at" />
              {startedAt ? (
                formatDate(startedAt)
              ) : (
                <span className="highlight">No start date!</span>
              )}
            </HoverMarquee>
          </h6>
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={ModifiedIcon} alt="Interview modified at" />
              {updatedAt ? (
                formatDate(updatedAt)
              ) : (
                <span className="highlight">Never changed!</span>
              )}
            </HoverMarquee>
          </h6>
        </div>
        <div className="meta">
          <h6 className="meta-wrapper__attribute progress-wrapper">
            <img src={FinishedIcon} alt="Interview finished at" />
            {progress === 100 && finishedAt ? (
              <div>{formatDate(finishedAt)}</div>
            ) : (
              <>
                <div> {progress}%</div>
                <ProgressBar
                  percentProgress={progress}
                  orientation="horizontal"
                />
              </>
            )}
          </h6>
          <h6 className="meta-wrapper__attribute">
            <HoverMarquee>
              <img src={ExportedIcon} alt="Interview exported at" />
              {exportedAt ? (
                formatDate(exportedAt)
              ) : (
                <span className="highlight">Not yet exported</span>
              )}
            </HoverMarquee>
          </h6>
        </div>
      </div>
    </div>
  );
}

export default InterviewCard;
