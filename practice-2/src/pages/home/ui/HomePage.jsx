import { SiteHeader, SiteFooter } from "@/widgets/site-layout";
import { Intro } from "@/widgets/intro";
import { About } from "@/widgets/about";
import { Experience } from "@/widgets/experience";
import { Expertise } from "@/widgets/expertise";
import { Background } from "@/widgets/background";
import { Contact } from "@/widgets/contact";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#about">
        Skip to content
      </a>
      <SiteHeader />
      <main>
        <Intro />
        <About />
        <Experience />
        <Expertise />
        <Background />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
