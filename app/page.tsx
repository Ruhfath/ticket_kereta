"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Home() {
  return (
    <main className="bg-slate-50">

      {/* HERO */}
      <section className="relative h-[700px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500">
        <Image
          src="/image/kereta.jpg"
          alt="Kereta"
          fill
          className="object-cover opacity-40"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 container mx-auto h-full flex items-center px-6">
          <div className="max-w-2xl text-white">

            
            <h1 className="text-7xl font-bold leading-tight text-white drop-shadow-lg mb-4">
              Perjalanan Nyaman
              <br />
              Bersama <span className="text-yellow-300 animate-pulse">Kami</span>
            </h1>

            <p className="text-xl text-gray-100 mb-8 max-w-lg">
              Pesan tiket kereta dengan cepat, mudah, dan aman. Ribuan rute tersedia dengan harga terbaik.
            </p>
          </div>
        </div>
      </section>

      

      {/* DESTINASI */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">

          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 text-black">
              Destinasi Terpopuler
            </h2>
            <p className="text-gray-600 text-lg">Jelajahi destinasi impian Anda dengan harga spesial</p>
          </div>

          <div className="pb-20">
            <Swiper
              modules={[Pagination, Autoplay, Navigation]}
              pagination={{
                clickable: true,
                bulletActiveClass: "swiper-pagination-bullet-active",
              }}
              navigation={true}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              loop={true}
              breakpoints={{
                640: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
              }}
              className="destinasi-swiper"
            >
              {[
                {
                  city: "Jakarta",
                  image: "/image/jakarta.jpg",
                  price: "120.000",
                },
                {
                  city: "Bandung",
                  image: "/image/bandung.jpg",
                  price: "90.000",
                },
                {
                  city: "Yogyakarta",
                  image: "/image/yogya.jpg",
                  price: "180.000",
                },
                {
                  city: "Surabaya",
                  image: "/image/surabaya.jpg",
                  price: "150.000",
                },
              ].map((item) => (
                <SwiperSlide key={item.city}>
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition duration-300 border border-gray-100">
                    <div className="relative">
                      <Image
                        src={item.image}
                        alt={item.city}
                        width={500}
                        height={300}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Populer</div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-2xl text-slate-800 mb-2">
                        {item.city}
                      </h3>

                      <div className="flex justify-between items-center">
                        <p className="text-blue-600 font-bold text-lg">
                          Rp {item.price}
                        </p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                          Pesan
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section className="container mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 text-9xl">🎉</div>

          <div className="relative z-10">
            <div className="inline-block bg-yellow-300 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
              ⭐ PENAWARAN TERBATAS
            </div>

            <h2 className="text-5xl font-bold mb-4">
              Diskon Hingga <span className="text-yellow-300">30%</span>
            </h2>

            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              Gunakan kode promo <span className="bg-white/20 px-3 py-1 rounded font-bold text-yellow-300">KERETA30</span> untuk mendapatkan diskon hingga 30% untuk semua destinasi favorit Anda.
            </p>

            <button className="bg-yellow-400 text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 hover:scale-105 transition duration-300 shadow-lg">
              🎁 Klaim Sekarang
            </button>

            <p className="text-blue-100 text-sm mt-4">* Berlaku untuk pembelian tiket hingga 30 Juni 2026</p>
          </div>
        </div>
      </section>

      {/* MENGAPA KAMI */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 text-black">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-gray-600 text-lg">Layanan terbaik untuk kenyamanan perjalanan Anda</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚂",
                title: "Ribuan Rute",
                desc: "Jangkauan ke seluruh Indonesia dengan ratusan stasiun tersedia"
              },
              {
                icon: "💰",
                title: "Harga Terjangkau",
                desc: "Harga kompetitif dengan berbagai pilihan kelas kereta"
              },
              {
                icon: "🛡️",
                title: "Pembayaran Aman",
                desc: "Sistem keamanan terpercaya dengan enkripsi tingkat bank"
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                desc: "Pesan tiket kapan saja, di mana saja melalui smartphone Anda"
              },
              {
                icon: "⚡",
                title: "Instan & Cepat",
                desc: "Konfirmasi tiket langsung dalam hitungan detik"
              },
              {
                icon: "👨‍💼",
                title: "Customer Service 24/7",
                desc: "Tim dukungan siap membantu Anda kapan saja"
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition duration-300 border border-blue-100">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 text-black">
              Apa Kata Pelanggan Kami?
            </h2>
            <p className="text-gray-600 text-lg">Ribuan pelanggan puas dengan layanan kami</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Budi Santoso",
                city: "Jakarta",
                rating: 5,
                text: "Layanan luar biasa! Prosesnya sangat mudah dan cepat. Saya sudah berkali-kali menggunakan aplikasi ini untuk perjalanan bisnis saya."
              },
              {
                name: "Siti Nurhaliza",
                city: "Bandung",
                rating: 5,
                text: "Harga yang sangat kompetitif dan pembayarannya aman. Rekomendasi terbaik untuk siapa saja yang ingin bepergian dengan kereta api."
              },
              {
                name: "Andi Wijaya",
                city: "Yogyakarta",
                rating: 5,
                text: "Customer service mereka sangat responsif dan helpful. Ketika ada masalah, langsung ditangani dengan profesional. Terima kasih!"
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300 border border-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {item.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.city}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Siap untuk Perjalanan Berikutnya?</h2>
          <p className="text-xl text-blue-100 mb-8">Mulai pesan tiket kereta Anda sekarang juga dan nikmati kemudahan perjalanan</p>
          <button className="bg-yellow-400 text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 hover:scale-105 transition duration-300 shadow-lg">
            Pesan Tiket Sekarang
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-gray-300 pt-16 pb-8">
        <div className="container mx-auto px-6">
          {/* Footer Top */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">🚂 Tiket Kereta</h3>
              <p className="text-sm leading-relaxed mb-4">Platform terpercaya untuk pemesanan tiket kereta api di seluruh Indonesia dengan harga terbaik.</p>
              <div className="flex gap-4">
                <a href="#" className="text-blue-400 hover:text-blue-300 transition">f</a>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition">𝕏</a>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition">📷</a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-6">Navigasi</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">Beranda</a></li>
                <li><a href="#" className="hover:text-white transition">Cari Tiket</a></li>
                <li><a href="#" className="hover:text-white transition">Destinasi</a></li>
                <li><a href="#" className="hover:text-white transition">Promo</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-bold mb-6">Dukungan</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">Hubungi Kami</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white transition">Kebijakan Privasi</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-6">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span>📧</span>
                  <span>support@tiketkereta.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>📱</span>
                  <span>+62 800-000-1234</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>📍</span>
                  <span>Jakarta, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 my-8"></div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400">© 2026 Tiket Kereta. Hak cipta dilindungi.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">Privasi</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Ketentuan</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Sitemap</a>
            </div>
          </div>

          {/* Back to Top */}
          <div className="text-center mt-8">
            <button className="text-gray-400 hover:text-white transition text-sm">↑ Kembali ke Atas</button>
          </div>
        </div>
      </footer>

    </main>
  );
}