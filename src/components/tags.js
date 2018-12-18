import React from 'react'

import styles from './tags.module.scss'

const Tags = ({tags}) => {
  if(!tags || !tags.length) {
    return null
  }
  const Tags = tags
    .map(tag => <small key={tag} className={styles.tag}>{tag}</small>)

  return <section className={styles.tags}>{Tags}</section>
}

export default Tags