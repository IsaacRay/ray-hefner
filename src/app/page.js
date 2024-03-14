import Image from "next/image";
import styles from "./page.module.css";
import {IsaacGarage} from "./buttons";
import {KathrynGarage} from "./buttons";



export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>

        < IsaacGarage />
        <KathrynGarage />
      </div>
    </main>
  );
}


