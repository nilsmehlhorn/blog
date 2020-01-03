const path = require('path')
const {createFilePath} = require(`gatsby-source-filesystem`)

exports.onCreateWebpackConfig = ({actions}) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            minimize: false
          }
        }
      ]
    }
  })
}

exports.createPages = ({actions, graphql}) => {
  const {createPage} = actions

  const postTemplate = path.resolve(`src/templates/post-template.js`)

  return graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___date] }
        limit: 1000
      ) {
        edges {
          node {
            id
            excerpt(pruneLength: 250)
            frontmatter {
              path
              date(formatString: "MMMM DD, YYYY")
              published
              tags
              title
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    const published = result.data.allMarkdownRemark.edges
      .filter(({node}) => node.frontmatter.published)

    published
      .forEach(({node}) => {
        const relatedPosts = published
          .filter(other => other.node.frontmatter.path !== node.frontmatter.path
            && node.frontmatter.tags.some(t => other.node.frontmatter.tags.includes(t))
          )
          .map(other => other.node.frontmatter.path)
        createPage({
          path: node.frontmatter.path,
          component: postTemplate,
          context: {relatedPosts}
        })
      })
  })
}

exports.onCreateNode = ({node, actions, getNode}) => {
  const {createNodeField} = actions
  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({node, getNode})
    createNodeField({
      name: `slug`,
      node,
      value
    })
  }
}
