module.exports = {
  siteMetadata: {
    title: 'Nils Mehlhorn',
    description: 'Product Developer. Freelance Software Consultant. Blogger',
    author: '@n_mehlhorn',
    baseUrl: 'https://nils-mehlhorn.de',
    siteUrl: 'https://nils-mehlhorn.de'
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
        path: `${__dirname}/posts`,
        name: 'posts'
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-prismjs`,
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 640,
              showCaptions: true,
              linkImagesToOriginal: false,
              backgroundColor: 'transparent'
            },
          }
        ],
      },
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Lessons Unlearned',
        short_name: 'lessons-unlearned',
        start_url: '/',
        background_color: '#db0404',
        theme_color: '#db0404',
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
    `gatsby-plugin-feed`
  ]
}
