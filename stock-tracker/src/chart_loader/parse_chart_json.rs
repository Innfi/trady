use json::{self, object, JsonValue};
use log::info;

pub fn parse_chart_json(
  timeseries_key: String,
  raw_data: String,
) -> Result<String, &'static str> {
  info!("parse_chart_json] key: {}", timeseries_key);

  let parsed = json::parse(&raw_data.as_str()).expect("parse error");
  let chart_data = &parsed[timeseries_key.as_str()];

  let timeseries: Vec<JsonValue> = chart_data
    .entries()
    .map(|x: (&str, &json::JsonValue)| to_timeseries_unit(x))
    .collect();

  if timeseries.is_empty() {
    return Err("empty chart data");
  }

  Ok(json::stringify(timeseries))
}

fn to_timeseries_unit(input: (&str, &json::JsonValue)) -> JsonValue {
  let name_open = "1. open";
  let name_high = "2. high";
  let name_low = "3. low";
  let name_close = "4. close";

  object! {
    date: String::from(input.0),
    chart_value: [
      input.1[name_open].as_str().unwrap(),
      input.1[name_high].as_str().unwrap(),
      input.1[name_low].as_str().unwrap(),
      input.1[name_close].as_str().unwrap()
    ]
  }
}
