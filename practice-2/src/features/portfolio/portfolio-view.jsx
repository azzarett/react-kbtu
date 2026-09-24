import { SiteHeader, SiteFooter } from "./components/site-layout/site-layout";
import { Intro } from "./components/intro/intro";
import { About } from "./components/about/about";
import { Experience } from "./components/experience/experience";
import { Expertise } from "./components/expertise/expertise";
import { Background } from "./components/background/background";
import { Contact } from "./components/contact/contact";
import styles from "./portfolio-view.module.css";

export function PortfolioView() {
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
