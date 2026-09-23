import { jobs, ExperienceRow } from "@/entities/experience";
import { ExperienceDetails } from "@/features/experience-details";
import { Section } from "@/shared/ui/section";

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
