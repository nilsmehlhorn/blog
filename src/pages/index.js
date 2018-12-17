import React from 'react'
import {graphql} from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'
import PostLink from '../components/post-link'

const IndexPage = ({
                     data: {
                       allMarkdownRemark: {edges}
                     }
                   }) => {
  const Posts = edges
    .filter(edge => edge.node.frontmatter.published)
    .map((edge, i) => {
      console.log(edge)
      const post = <PostLink key={edge.node.id} post={edge.node}/>
      return i > 0 ? [<hr/>, post] : post
    })

  return <Layout>
    <SEO title="Start" keywords={['blog', 'software', 'angular']}/>
    {Posts}
  </Layout>
}

export default IndexPage

export const pageQuery = graphql`
  query {
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
          }
        }
      }
    }
  }
`