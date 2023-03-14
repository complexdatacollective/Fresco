import { KeyboardEvent, MouseEvent } from "react";
import cx from "classnames";
import Icon from "@/components/Icon/Icon";
import "./ProtocolCard.scss";

const formatDate = (timeString: Date) =>
  timeString && new Date(timeString).toLocaleString(undefined);

type ProtocolCardProps = {
  selected?: boolean;
  condensed?: boolean;
  schemaVersion: string;
  importedAt: Date;
  lastModified: Date;
  name: string;
  description?: string;
  isOutdated?: boolean;
  isObsolete?: boolean;
  onStatusClickHandler?: (() => void) | undefined;
  onClickHandler?: (() => void) | undefined;
};

function ProtocolCard({
  selected = false,
  condensed = false,
  schemaVersion,
  importedAt,
  lastModified,
  name,
  description = "",
  isOutdated = false,
  isObsolete = false,
  onStatusClickHandler = undefined,
  onClickHandler = undefined,
}: ProtocolCardProps) {
  const modifierClasses = cx(
    "protocol-card",
    { "protocol-card--clickable": onClickHandler },
    { "protocol-card--condensed": condensed },
    { "protocol-card--selected": selected },
    { "protocol-card--outdated": !isObsolete && isOutdated },
    { "protocol-card--obsolete": isObsolete }
  );
  const handleStatusClick = (
    e: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    if (onStatusClickHandler) {
      onStatusClickHandler();
    }
  };

  const renderStatusIcon = () => {
    if (isOutdated || isObsolete) {
      const classes = cx(
        "status-icon",
        { "status-icon--outdated": !isObsolete && isOutdated },
        { "status-icon--obsolete": isObsolete }
      );

      return (
        <div
          className={classes}
          onClick={handleStatusClick}
          onKeyDown={handleStatusClick}
          role="button"
          tabIndex={0}
        >
          <Icon name={isOutdated ? "warning" : "error"} />
        </div>
      );
    }

    return (
      <div className="protocol-icon">
        <Icon name="protocol-card" />
      </div>
    );
  };

  const renderDescription = () => {
    if (condensed) {
      return (
        <div className="protocol-description protocol-description--condensed">
          {description}
        </div>
      );
    }

    return <div className="protocol-description">{description}</div>;
  };

  return (
    <div
      className={modifierClasses}
      onClick={onClickHandler}
      onKeyDown={onClickHandler}
      role="button"
      tabIndex={0}
    >
      <div className="protocol-card__icon-section">
        {renderStatusIcon()}
        {!condensed && (
          <div className="protocol-meta">
            <h6>Imported: {formatDate(importedAt)}</h6>
            <h6>Modified: {formatDate(lastModified)}</h6>
            <h6>Schema Version: {schemaVersion}</h6>
          </div>
        )}
      </div>
      <div className="protocol-card__main-section">
        <h2 className="protocol-name">{name}</h2>
        {description && renderDescription()}
      </div>
    </div>
  );
}

export default ProtocolCard;
