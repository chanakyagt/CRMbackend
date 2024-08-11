const Overview = require('../models/overview');

const generateCode = async (category, codeSeries) => {
  try {
    // Find the overview document for the given category
    let overview = await Overview.findOne({ category });

    if (overview) {
      // Increment the latest entry number
      overview.latestEntry += 1;
    } else {
      // Create a new overview document if it doesn't exist
      overview = new Overview({
        category,
        codeSeries,
        latestEntry: 1,
        numberOfEntries: 1,
      });
    }

    // Save the overview document
    await overview.save();

    // Generate the code using the codeSeries and the latest entry number
    const code = `${codeSeries}${overview.latestEntry}`;
    return code;
  } catch (error) {
    console.error('Error generating code:', error);
    throw new Error('Could not generate code');
  }
};

module.exports = { generateCode };
