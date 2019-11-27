import React from 'react'

import styles from './tags.module.scss'
import {classes} from '../util/classes'

const Tags = ({tags, className}) => {
  if(!tags || !tags.length) {
    return null
  }
  const Tags = tags
    .map(tag => <small key={tag} className={styles.tag}>{tag}</small>)

  return <section className={classes(styles.tags, className)}>{Tags}</section>
}

export default Tags
