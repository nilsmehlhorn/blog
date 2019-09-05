import React from 'react'

import PostLink from './post-link'

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
    .map((node, i) => {
      const post = <PostLink key={node.id + '-related'} post={node}/>
      return i > 0 ? [<hr key={i + '-hr-related'}/>, post] : post
    })

  return (
    <section key={'related-posts'}>
      <hr/>
      {related}
    </section>
  )
}

export default RelatedPosts
