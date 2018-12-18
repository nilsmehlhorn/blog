import React from "react"

import styles from "./bio.module.scss"
import {FaHandPeace} from 'react-icons/fa'

const Bio = () => (
  <section className={styles.bio}>
    Hey there <FaHandPeace color="yellow"/><br/>
    This is a space where I'll explore any topic I just can't keep my mouth shut about. I'm mostly doing
    web development, but here we'll wander off into any direction that seems interesting.<br/>
    Enjoy the ride!
  </section>
)

export default Bio