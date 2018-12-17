import React from "react"
import {Link} from "gatsby"

import styles from "./post-link.module.scss"

const PostLink = ({post}) => (
  <div>
    <Link className={styles.link} to={post.frontmatter.path}>
      <h2 className={styles.thumbTitle}>{post.frontmatter.title}</h2>
    </Link>
    <p className={styles.thumbSub}>{post.frontmatter.date}</p>
    <p>{post.excerpt}</p>
  </div>
)

export default PostLink