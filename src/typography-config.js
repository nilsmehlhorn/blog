import Typography from 'typography'
import elkGlenTheme from 'typography-theme-elk-glen'

elkGlenTheme.overrideThemeStyles = ({rhythm}) => ({
  'h1,h2,h3,h4,h5,h6': {
    marginTop: rhythm(1)
  },
  'h6': {
    textAlign: 'right',
    marginTop: 0,
    marginBottom: rhythm(0.25),
    fontStyle: 'italic'
  },
  'a': {
    backgroundImage: 'none',
    textShadow: 'none',
    textDecoration: 'underline'
  }
})

const typography = new Typography(elkGlenTheme)

export default typography
