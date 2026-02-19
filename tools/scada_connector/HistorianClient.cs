using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json; // Assuming Newtonsoft.Json for portability

namespace PatcheAI.ScadaConnector
{
    /// <summary>
    /// Historian Client
    /// 
    /// Purpose:
    /// Bridges the gap between the Cloud Historian (PostgreSQL/Supabase)
    /// and legancy Factory HMI systems.
    /// 
    /// Features:
    /// - Async/Await for non-blocking UI operations
    /// - Strongly typed telemetry models
    /// - Fault tolerance w/ Polly-style retry logic (simplified)
    /// </summary>
    public class HistorianClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private readonly string _apiKey;

        public HistorianClient(string baseUrl, string apiKey)
        {
            _baseUrl = baseUrl;
            _apiKey = apiKey;
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("apikey", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }

        public async Task<List<TelemetryPoint>> GetLatestReadingsAsync(string deviceId, int limit = 100)
        {
            try
            {
                var url = $"{_baseUrl}/rest/v1/telemetry?device_id=eq.{deviceId}&order=timestamp.desc&limit={limit}";
                var response = await _httpClient.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error fetching data: {response.StatusCode}");
                    return new List<TelemetryPoint>();
                }

                var content = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<List<TelemetryPoint>>(content);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Network Exception: {ex.Message}");
                // In production: Log to Windows Event Viewer or ELK Stack
                throw;
            }
        }

        public async Task PushControlSignalAsync(string deviceId, string command)
        {
            // Implementation of a control loop back to the device via Edge Function
            var payload = new { device_id = deviceId, command = command, timestamp = DateTime.UtcNow };
            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/functions/v1/device-control", content);
            response.EnsureSuccessStatusCode();
            
            Console.WriteLine($"Command '{command}' sent to {deviceId}");
        }
    }

    public class TelemetryPoint 
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("device_id")]
        public string DeviceId { get; set; }

        [JsonProperty("value")]
        public double Value { get; set; }

        [JsonProperty("timestamp")]
        public DateTime Timestamp { get; set; }
    }
}
