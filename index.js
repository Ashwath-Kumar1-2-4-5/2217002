import express from 'express';
const app = express();
const port = 3000;
app.use(express.json());

const urlStore = {};

function getExpiryDate(validity) {
	const now = new Date();
	now.setMinutes(now.getMinutes() + validity);
	return now.toISOString();
}

app.post('/shorturls', (req, res) => {
	const { url, validity = 30, shortcode } = req.body;
	if (!url || typeof url !== 'string') {
		return res.status(400).json({ error: 'url is required and must be a string' });
	}
	let code = shortcode;
	if (!code) {
		code = Math.random().toString(36).substr(2, 6);
	}
	if (urlStore[code]) {
		return res.status(409).json({ error: 'Shortcode already exists' });
	}
	const expiry = getExpiryDate(validity);
	urlStore[code] = {
		url,
		created: new Date().toISOString(),
		expiry,
		validity
	};
	   res.status(201).json({
			   shortLink: `http://localhost:${port}/${code}`,
			   expiry
	   });
});

app.get('/shorturls/:shortcode', (req, res) => {
	const { shortcode } = req.params;
	const entry = urlStore[shortcode];
	if (!entry) {
		return res.status(404).json({ error: 'Shortcode not found' });
	}
	const now = new Date();
	if (new Date(entry.expiry) < now) {
		return res.status(410).json({ error: 'Shortcode expired' });
	}
	   res.json({
			   originalUrl: entry.url,
			   created: entry.created,
			   expiry: entry.expiry,
			   shortLink: `http://localhost:${port}/${shortcode}`
	   });
});

app.get('/:shortcode', (req, res) => {
	const { shortcode } = req.params;
	const entry = urlStore[shortcode];
	if (!entry) {
		return res.status(404).send('Shortcode not found');
	}
	const now = new Date();
	if (new Date(entry.expiry) < now) {
		return res.status(410).send('Shortcode expired');
	}
	res.redirect(entry.url);
});

app.listen(port, () => {
	   console.log(`URL Shortener running at http://localhost:${port}`);
});