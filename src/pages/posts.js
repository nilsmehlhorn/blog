import React from 'react'
import {graphql} from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'
import PostLink from '../components/post-link'

import styles from './posts.module.scss'

const PostsPage = ({
                     data: {
                       site,
                       allMarkdownRemark: {edges}
                     }
                   }) => {
  const Posts = edges
    .filter(edge => edge.node.frontmatter.published)
    .map(edge => <PostLink key={edge.node.id} post={edge.node}/>)
  return <Layout>
    <SEO key={'seo'} title={'Blog'} keywords={['blog', 'software', 'angular']}/>
    <div className="content-padding">
      <h1>Lessons Unlearned</h1>
      <div className={styles.posts}>
        {Posts}
      </div>
    </div>
  </Layout>
}

export default PostsPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          id
          excerpt(pruneLength: 250)
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            path
            title
            published
            tags
            banner {
              previewImg: childImageSharp {
                fluid(maxHeight: 300, maxWidth: 960) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    }
  }
`