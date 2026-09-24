import { jobs } from "../../constants/jobs";
import { ExperienceRow } from "../experience-row/experience-row";
import { ExperienceDetails } from "../experience-details/experience-details";
import { Section } from "@/common/components/ui/section";

export function Experience() {
  return (
    <Section id="experience" title="Experience" number="02">
      {jobs.map((job) => (
        <ExperienceRow key={job.company} job={job}>
          {job.details.length > 0 && (
            <ExperienceDetails contributions={job.details} />
          )}
        </ExperienceRow>
      ))}
    </Section>
  );
}
