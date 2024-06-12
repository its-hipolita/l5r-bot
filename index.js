const { Client, Intents, MessageEmbed } = require('discord.js');
const { Pool } = require('pg');
const express = require('express');
require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'images' directory
app.use('/images', express.static('images'));

// Start the Express server
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Fetch card details from the database
async function getCardDetails(cardName) {
  const query = 'SELECT * FROM cards WHERE name = $1';
  const values = [cardName];
  
  try {
    const res = await pool.query(query, values);
    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    console.error('Database query error:', err);
    return null;
  }
}

// Event listener for when the bot is ready
client.once('ready', () => {
  console.log('Bot is ready!');
});

// Event listener for messages
client.on('messageCreate', async (message) => {
  const regex = /\[\[(.*?)\]\]/;
  const match = message.content.match(regex);

  if (match) {
    const cardName = match[1];
    const cardDetails = await getCardDetails(cardName);

    if (cardDetails) {
      const imageUrl = `${process.env.BASE_URL}/images/${cardDetails.image}`;
      const embed = new MessageEmbed()
        .setTitle(cardDetails.name)
        .setDescription(cardDetails.text)
        .setImage(imageUrl) // Use the constructed full URL
        .setColor('#0099ff');

      message.channel.send({ embeds: [embed] });
    } else {
      message.channel.send(`Card "${cardName}" not found.`);
    }
  }
});

// Log in to Discord
client.login(process.env.DISCORD_TOKEN);
