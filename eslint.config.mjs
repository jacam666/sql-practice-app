import nextVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
	...nextVitals,
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/purity": "off",
			"import/no-anonymous-default-export": "off",
		},
	},
]

export default eslintConfig
