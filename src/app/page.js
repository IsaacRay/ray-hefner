import Image from "next/image";
import styles from "./page.module.css";
import {FamilyRoomLight, IsaacGarage, KathrynGarage} from "./buttons";



export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>

        < IsaacGarage />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        < KathrynGarage />
        <br/> <br/>
        <FamilyRoomLight />
      </div>
    </main>
  );
}


