"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Button from "~/ui/components/Button";

const Interview = () => {
    const [stages, setStages] = useState([]);
    const [stageIndex, setStageIndex] = useState(0);
    const { data, isLoading } = useQuery(["interviewID"], () =>
    fetch("/api/interview/[interviewID]").then((res) => res.json())
    );

    if (data && stages.length === 0) {
        const protocolJSON = JSON.parse(data?.data.data);
        setStages(protocolJSON.stages);
        console.log('protocoljson', protocolJSON.stages);
        console.log('stages', stages);
    }

    // Stage navigation
    const handleBack = () => {
        if (stageIndex === 0) {
            return;
        }
        setStageIndex(stageIndex - 1);
        console.log('current stage', stages[stageIndex])
    }

    const handleForward = () => {
        if (stageIndex === stages.length - 1) {
            return;
        }
        setStageIndex(stageIndex + 1);
        console.log('current stage', stages[stageIndex])
    }


    return (
        <section className="container">
          <h1 className="text-2xl font-bold">
          This is a <span className="text-emerald-400">{data?.data.name}</span>{" "}
        Interview
          </h1>
          {isLoading && <p>Loading protocol...</p>}
          {stages.length!==0 && <h2 >Current Stage Name: {stages[stageIndex].label}</h2>}
          

          <Button onClick={handleBack}>Previous Stage</Button>
          <Button onClick={handleForward}>Next Stage</Button>
        </section>
      );
}

export default Interview;