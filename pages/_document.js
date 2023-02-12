import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript className="d-flex flex-column" />
		<style>
		{`
			html, body, #__next {
				min-height: 100vh;
				display: flex;
				flex-direction: column;
			}
		`}
		</style>
      </body>
    </Html>
  )
}
