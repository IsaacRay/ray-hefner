import Image from "next/image";
import styles from "./page.module.css";
import {ColtonDemerit, ColtonStar, FamilyRoomLight, IsaacGarage, KathrynGarage, Logging} from "./buttons";
import Link from 'next/link';


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
        <p><Logging /></p>
<p>
        <Link href="/groceries">
        <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          Groceries
        </button>
      </Link>
      </p>
        </div>
    </main>
  );
}


