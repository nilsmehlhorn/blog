import React from 'react'

import PostLink from './post-link'

import styles from './related-posts.module.scss'

const RelatedPosts = ({posts}) => {
  if (!posts.length) {
    return null
  }
  const selected = []
  while (selected.length < Math.min(posts.length, 2)) {
    const p = posts[Math.floor(Math.random() * posts.length)]
    if (!selected.includes(p)) {
      selected.push(p)
    }
  }
  const related = selected
    .map(node => <PostLink key={node.id + '-related'} post={node}/>)

  return (
    <section className={styles.posts} key={'related-posts'}>
      {related}
    </section>
  )
}

export default RelatedPosts
