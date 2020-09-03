module.exports = {
  siteMetadata: {
    title: 'Nils Mehlhorn',
    description: 'Product Developer. Freelance Software Consultant. Blogger.',
    author: '@n_mehlhorn',
    baseUrl: 'https://nils-mehlhorn.de',
    siteUrl: 'https://nils-mehlhorn.de'
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-plugin-react-helmet-canonical-urls`,
      options: {
        siteUrl: `https://nils-mehlhorn.de`,
      },
    },
    'gatsby-transformer-yaml',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/posts`,
        name: 'posts'
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content`,
        name: 'content'
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-table-of-contents`,
          `gatsby-remark-autolink-headers`,
          `gatsby-remark-prismjs`,
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 944,
              showCaptions: true,
              linkImagesToOriginal: false,
              backgroundColor: 'transparent'
            }
          },
          {
            resolve: 'gatsby-remark-custom-blocks',
            options: {
              blocks: {
                info: {
                  classes: 'info',
                  title: 'optional'
                }
              }
            }
          }
        ]
      }
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Nils Mehlhorn',
        short_name: 'nils-mehlhorn',
        start_url: '/',
        background_color: '#f0f1f3',
        theme_color: '#77a354',
        display: 'minimal-ui',
        icon: 'src/images/logo.png'
      }
    },
    'gatsby-plugin-sass',
    {
      resolve: `gatsby-plugin-typography`,
      options: {pathToConfigModule: `src/typography-config.js`}
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: 'UA-131311054-1',
        anonymize: true,
        respectDNT: true,
        head: true
      }
    },
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        feeds: [{
          title: 'Nils Mehlhorn Blog Posts',
          output: '/rss.xml',
          query: `
              {
                allMarkdownRemark(sort: {order: DESC, fields: [frontmatter___date]}, filter: {frontmatter: {path: {glob: "/posts/*"}}}) {
                  edges {
                    node {
                      excerpt
                      html
                      fields {
                        slug
                      }
                      frontmatter {
                        title
                        date
                        path
                        description
                        published
                      }
                    }
                  }
                }
              }
          `,
          serialize: ({ query: { site, allMarkdownRemark } }) => allMarkdownRemark.edges
            .filter(edge => edge.node.frontmatter.published)
            .map(edge => {
              return Object.assign({}, edge.node.frontmatter, {
                description: edge.node.frontmatter.description || edge.node.excerpt,
                date: edge.node.frontmatter.date,
                url: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
                guid: site.siteMetadata.siteUrl + edge.node.frontmatter.path,
                custom_elements: [{ "content:encoded": edge.node.html }],
              })
            })
        }]
      }
    },
    {
      resolve: `gatsby-plugin-netlify`,
      options: {
        headers: {
          '/slides/*': [
            'Access-Control-Allow-Origin: *'
          ]
        }
      }
    }
  ]
}
