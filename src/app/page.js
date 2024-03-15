import Image from "next/image";
import styles from "./page.module.css";
import {ColtonDemerit, ColtonStar, FamilyRoomLight, IsaacGarage, KathrynGarage} from "./buttons";



export default function Home() {
  return (
    <main className={styles.main}>
        <div className={styles.buttons}>
        <p>
        < IsaacGarage />
       </p>
       <p>
        < KathrynGarage />
        </p><p>
        <FamilyRoomLight />
        </p>
        <p>
        <ColtonStar />
        </p>
        <p>
        <ColtonDemerit />
        </p>
        </div>
    </main>
  );
}


