module.exports = {
  siteMetadata: {
    title: 'Code Culture',
    description: 'Software thoughts by a software person',
    author: '@n_mehlhorn'
  },
  plugins: [
    'gatsby-plugin-react-helmet',
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
        path: `${__dirname}/src/pages/posts`,
        name: 'posts'
      }
    },
    'gatsby-transformer-remark',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Nils\' Blog',
        short_name: 'nils-blog',
        start_url: '/',
        background_color: '#db0404',
        theme_color: '#db0404',
        display: 'minimal-ui',
        icon: 'src/images/icon.png' // This path is relative to the root of the site.
      }
    },
    'gatsby-plugin-sass',
    {
      resolve: `gatsby-plugin-typography`,
      options: {pathToConfigModule: `src/typography-config.js`}
    }
  ]
}
